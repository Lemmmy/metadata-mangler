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

FROM node:23-bookworm

RUN apt-get update && apt-get install -y flac vorbis-tools python3 python3-pip icu-devtools
RUN pip3 install --break-system-packages mutagen

COPY ./package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build

WORKDIR /app
RUN corepack enable
RUN corepack install

ENV NODE_ENV=production

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

CMD ["pnpm", "run", "start"]
