FROM node:10.16

# @FIX Debian Jessie / Docker issue with apt.
# See: https://stackoverflow.com/questions/46406847/docker-how-to-add-backports-to-sources-list-via-dockerfile
RUN echo "deb http://archive.debian.org/debian/ jessie main\n" \
  "deb-src http://archive.debian.org/debian/ jessie main\n" \
  "deb http://security.debian.org jessie/updates main\n" \
  "deb-src http://security.debian.org jessie/updates main" > /etc/apt/sources.list

# Update the apt cache
RUN apt-get clean
RUN apt-get update

# Apt-utils needs to be in before installing the rest
RUN apt-get install -y \
  build-essential \
  python \
  curl \
  file \
  zip

# Add the repo
ADD . / pinion/
WORKDIR /pinion

# Install node_modules
RUN yarn

# Build the production bundle
ENV NODE_ENV production

# Build the bundle (this brings in tsc)
RUN yarn build

# A bit of cleanup
RUN rm -Rf node_modules

# We still need to keep some production packages installed
RUN yarn --production

# READY! SET! GO!
ENTRYPOINT /pinion/bin/index.js
