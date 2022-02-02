# version de l'image de Node qu'on va utiliser
FROM node:16.13.2

# copie le contenu de src de ce projet à l'emplacement /opt/app de notre image
COPY src /opt/app

WORKDIR /opt/app/

# Pour que les modules soient installés lorsque l'on run le container
RUN npm install

# spécifie la commande à exécuter quand on lance un docker sur la base de cette image, va donc exécuter notre script musician.js
ENTRYPOINT ["node", "/opt/app/musician.js"]