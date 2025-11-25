// look up vendors by url
import { z } from 'zod'
import { useDB } from '../../../server/utils/db'
import { vendors } from '../../../server/utils/schema'
import { eq } from 'drizzle-orm'
import parse from '../../../server/utils/set-cookie-parser'
import { parseHTML } from 'linkedom'
import { createError, eventHandler, getHeaders, getQuery } from 'h3'

const querySchema = z.object({
  url: z.string().trim().min(1, 'URL is required').url('Enter a valid URL')
})

export default eventHandler(async (event) => {
  const rawQuery = getQuery(event)
  const parsed = querySchema.safeParse(rawQuery)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsed.error.flatten().formErrors.join(', ') || 'Invalid query',
      data: parsed.error.flatten().fieldErrors
    })
  }

  const { url } = parsed.data
  const urlObj = new URL(url)
  const variantId = urlObj.searchParams.get('variant') ?? null
  const vendor = await useDB().query.vendors.findFirst({
    where: eq(vendors.hostname, urlObj.hostname)
  })

  if (!vendor) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
  }
  if (vendor.type == 'shopify') {
    // strip collections from path
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const productIndex = pathParts.indexOf('products')
    pathParts.splice(0, productIndex)
    const productPath = pathParts.join('/')

    const expectedPrefix = 'products/'
    // pull product.json from shopify
    if (productPath.startsWith(expectedPrefix)) {
      const productHandle = productPath.slice(expectedPrefix.length)
      const productJsonUrl = `${urlObj.origin}/products/${productHandle}.json`

      const res = await fetch(productJsonUrl)
      if (!res.ok) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Product not found on vendor site'
        })
      }
      const productData = await res.json()
      return {
        vendor,
        productData,
        variantId
      }
    }
  }
  if (vendor.type == 'bigcommerce') {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    })
    if (!res.ok) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found on vendor site'
      })
    }
    const html = await res.text()
    const tokenMatch = html.match(/"graphQLToken\\":\\"([^"]+)\\"/)
    //                                     <input type="hidden" name="product_id" value="626"/>

    const productIdMatch = html.match(
      /<input type="hidden" name="product_id" value="(\d+)"/
    )

    if (!tokenMatch || !productIdMatch) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'Could not extract storefront token or product ID from page'
      })
    }
    const setCookies = res.headers.get('set-cookie') || ''
    const cookies = parse(setCookies)
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const STOREFRONT_TOKEN = tokenMatch[1]
    const graphQlRes = await fetch(`https://${vendor.hostname}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STOREFRONT_TOKEN}`,
        'Cookie': cookieString
      },
      body: JSON.stringify({
        /* graphql look for product with path */
        query: `query paginateProducts {
  site {
    product(entityId: ${productIdMatch[1]}) {
      entityId
      name
      path
      addToCartUrl
      minPurchaseQuantity
      defaultImage {
        url(width: 80, height: 80)
      }
      availabilityV2 {
        status
        ... on ProductUnavailable {
          message
        }
      }
      prices(includeTax: false, currencyCode: USD) {
        price {
          value
          currencyCode
        }
        salePrice {
          value
          currencyCode
        }
        basePrice {
          value
          currencyCode
        }
        retailPrice {
          value
          currencyCode
        }
        mapPrice {
          value
          currencyCode
        }
      }
      productOptions(first: 50) {
        edges {
          node
            {
              entityId
              displayName
              isRequired
              ... on MultipleChoiceOption {
                isVariantOption
                displayStyle
                values {
                  edges {
                    node {
                      entityId
                      label
                    }
                  }
                }
              }
            }
          }
        }

      variants(first: 50) {
        edges {
          node {
            id
            entityId
            sku
            upc
            mpn
            prices {
              price {
                  value
              }
            }
            productOptions(first: 5) {
              edges {
                node {
                entityId
                displayName
                isRequired

                  ... on MultipleChoiceOption {
                    isVariantOption
                    displayStyle
                    values {
                      edges {
                        node {
                          entityId
                          label
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`,

        variables: {
          path: urlObj.pathname
        }
      })
    })
    const graphQlData = await graphQlRes.json()

    if (!graphQlRes.ok) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found on vendor site'
      })
    }
    const p = graphQlData.data.site.product

    return {
      vendor,
      productData: {
        product: {
          title: p.name,
          handle: p.path,
          price: p.prices.basePrice.value,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          variants: p.variants.edges?.map((edge: any) => ({
            price: edge.node.prices.price.value,
            id: edge.node.sku,
            title:
              edge?.node.productOptions.edges[0]?.node.values.edges[0]?.node
                .label
          }))
        }
      },
      variantId
    }
  }
  if (vendor.type == 'amazon') {
    // fetch url
    // pass along user agent, accept language, accept encoding headers, accept headers
    const requestHeaders = getHeaders(event)

    const res = await fetch(url, {
      headers: {
        'User-Agent': requestHeaders['User-Agent'] || '',
        'Accept-Language': requestHeaders['Accept-Language'] || '',
        'Accept-Encoding': requestHeaders['Accept-Encoding'] || '',
        'Accept': requestHeaders['Accept'] || ''
      }
    })
    if (!res.ok) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found on vendor site'
      })
    }
    const html = await res.text()
    const { document } = parseHTML(html)
    // amazon uses a lot of dynamic content, so we need to parse the html
    // and look for the product title and price
    const titleElement = document.querySelector('#productTitle')
    const priceWhole = document.querySelector('.a-price-whole')
    const priceFraction = document.querySelector('.a-price-fraction')
    if (!titleElement || !priceWhole) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not extract product data from page'
      })
    }
    const title = titleElement.textContent.trim()
    const price = parseFloat(
      priceWhole.textContent.replace(/[^\d]/g, '')
      + '.'
      + (priceFraction
        ? priceFraction.textContent.replace(/[^\d]/g, '')
        : '00')
    )

    return {
      vendor,
      productData: {
        product: {
          title,
          variants: [
            {
              id: variantId || 'default',
              title: 'Default',
              price
            }
          ],
          price
        }
      },
      variantId
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unsupported vendor' })
})
