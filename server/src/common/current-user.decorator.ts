import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  phone: string;
}

export const CurrentUser = createParamDecorator<keyof RequestUser | undefined>(
  (data, ctx: ExecutionContext): RequestUser | string => {
    const req = ctx.switchToHttp().getRequest();
    const user: RequestUser = req.user;
    return data ? user[data] : user;
  },
);
