import axios from 'axios'

const http = axios.create({
  baseURL: 'https://cloud.minapp.com/userve/v1/',
  withCredentials: true,
})

export default http