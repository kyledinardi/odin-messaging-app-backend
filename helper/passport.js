const passport = require('passport');
const bcrypt = require('bcryptjs');
const LocalStragetgy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(
  new LocalStragetgy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      let match = false;

      if (user) {
        match = await bcrypt.compare(password, user.passwordHash);
      }
      
      if (!match) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },

    async (jwtPayload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.id },
        });

        return done(null, user || false);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);
