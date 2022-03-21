FROM gitpod/workspace-full-vnc
USER gitpod
RUN npm install expo-cli --global
RUN nvm install 10.16.0
RUN nvm use 10.16.0