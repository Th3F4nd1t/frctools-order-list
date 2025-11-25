import { useAuth } from '../../utils/auth' // path to your auth file

export default defineEventHandler((event) => {
  return useAuth().handler(toWebRequest(event))
})
