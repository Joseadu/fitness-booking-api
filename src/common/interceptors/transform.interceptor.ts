import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Transform Interceptor
 * Automatically converts response keys from camelCase to snake_case
 * This ensures consistency between backend (camelCase) and frontend expectations (snake_case)
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => this.transformKeys(data))
        );
    }

    private transformKeys(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.transformKeys(item));
        }

        if (typeof obj === 'object' && obj.constructor === Object) {
            const transformed: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const snakeKey = this.camelToSnake(key);
                    transformed[snakeKey] = this.transformKeys(obj[key]);
                }
            }
            return transformed;
        }

        return obj;
    }

    private camelToSnake(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
