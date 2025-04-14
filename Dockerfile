FROM node:23-alpine AS pnpm
COPY ./package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN corepack enable
RUN corepack install

FROM pnpm AS development-dependencies-env
COPY . /app/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM pnpm AS production-dependencies-env
RUN pnpm install --frozen-lockfile -P --ignore-scripts

FROM pnpm AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
RUN pnpm run build

FROM pnpm

RUN apk add --no-cache flac vorbis-tools python3 mutagen icu-data-full

COPY ./package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build

WORKDIR /app

ENV NODE_ENV=production

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

CMD ["pnpm", "run", "start"]
