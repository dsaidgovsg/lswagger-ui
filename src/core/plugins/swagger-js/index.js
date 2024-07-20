import Swagger from "swagger-client"

const createExecutor = (origExecutor) => (opts) => {
  const origRequestInterceptor = opts.requestInterceptor

  const newOpts = {
    ...opts,
    requestInterceptor: (req) => {
      let request = origRequestInterceptor ? origRequestInterceptor(req) : req
      if(typeof request === "string") {
        request = {
          ...req,
          headers: {
            ...req.headers,
            "Source": "swagger"
          },
          credentials: "omit"
        }
      }else {
        request = {
          ...req,
          headers: {
            ...req.headers,
            "Source": "swagger"
          },
          credentials: "omit"
        }
      }
      return request
    }
  }
  return origExecutor(newOpts)
}

module.exports = function({ configs }) {
  return {
    fn: {
      fetch: Swagger.makeHttp(configs.preFetch, configs.postFetch),
      buildRequest: Swagger.buildRequest,
      execute: createExecutor(Swagger.execute),
      resolve: Swagger.resolve,
      serializeRes: Swagger.serializeRes,
      opId: Swagger.helpers.opId
    }
  }
}
