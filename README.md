# Ewplication sur comment faire tourner le site

## Etape 1 : cloner le dépot (si il y a un problème avec le zip fourni)
git clone https://github.com/AbidinOulladali/cine-project.git, puis faire : 
cd cine-project
c'est pour ce placer dans le bon dosser

## Etape 2 : installer les dependance
npm start

## Etape 3 : Laner le serveur
lancer le serveur : npm start

## Etape 4 : Si ngrok n'est pas lancer, le lancer
télécharger ngrok, puis tapper : ngrok http 8080
Dans mon cas l'URL publique qu'il me renvoie est : 
'https://viscously-stratospherical-loralee.ngrok-free.dev'.
Dans authService.ts, ligne 30, il y a : 
const redirectUrl = "https://viscously-stratospherical-loralee.ngrok-free.dev/"; // URL de redirection après authentification
et dans mon API, en tant que API redirection, c'est ce qu'il y a , si vous avez une autre URL 
publique je peux la changer.

