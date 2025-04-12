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

RUN apk add --no-cache flac vorbis-tools python3 py3-pip
RUN pip3 install mutagen

COPY ./package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build

WORKDIR /app

ENV NODE_ENV=production

ENV METAFLAC_PATH=/usr/bin/metaflac
ENV MID3V2_PATH=/usr/bin/mid3v2
ENV VORBISCOMMENT_PATH=/usr/bin/vorbiscomment

CMD ["pnpm", "run", "start"]
