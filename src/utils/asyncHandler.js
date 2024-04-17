const asyncHandler = (requestHandler) => {
  ;(req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    Promise.reject
  }
}

export { asyncHandler }
