function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));
      return next(error);
    }

    req.validated = result.data;
    return next();
  };
}

export { validate };
