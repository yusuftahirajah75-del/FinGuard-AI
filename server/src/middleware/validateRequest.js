/**
 * Zod Request Validation Middleware
 */
export function validateRequest(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Request validation failed',
          errors: formattedErrors,
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid request payload',
      });
    }
  };
}

export default validateRequest;
