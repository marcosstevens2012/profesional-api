import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from "@nestjs/common";
import { ZodError, ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private _schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsedValue = this._schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(
          err => `${err.path.join(".")}: ${err.message}`
        );
        throw new BadRequestException({
          message: "Validation failed",
          errors: errorMessages,
        });
      }
      throw new BadRequestException("Validation failed");
    }
  }
}
