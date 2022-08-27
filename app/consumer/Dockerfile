# Use a lighter version of Node as a parent image
FROM mhart/alpine-node:16.4.2
# Set the working directory to /api
WORKDIR /api
# copy package.json into the container at /api
COPY package*.json /api/
COPY yarn.lock /api/
# install dependencies
RUN yarn install
# Copy the current directory contents into the container at /api
COPY . /api/
# Make port 80 available to the world outside this container
EXPOSE 9000
# Run the app when the container launches
CMD ["yarn", "start"]