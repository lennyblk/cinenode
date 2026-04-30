import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // on recup le token du header
      secretOrKey: process.env.JWT_AT_SECRET ?? 'dev_at_secret',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
    // fait derriere req.user = payload
  }
}
