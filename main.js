import * as THREE from 'three';

// Initialisation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Créer le sol
const floorGeometry = new THREE.PlaneGeometry(30, 30);
const floorMaterial = new THREE.MeshBasicMaterial({color: 0x666666, side: THREE.DoubleSide});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2; // Pour que le sol soit horizontal
scene.add(floor);

// Créer des murs invisibles
const wallMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.5});
const wallDimensions = [30, 5, 1]; // Largeur, hauteur, épaisseur

// Ajouter 4 murs pour délimiter la carte
for (let i = 0; i < 4; i++) {
    const wallGeometry = new THREE.BoxGeometry(...wallDimensions);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    switch (i) {
        case 0: // Mur du haut
            wall.position.set(0, wallDimensions[1] / 2, 15);
            break;
        case 1: // Mur du bas
            wall.position.set(0, wallDimensions[1] / 2, -15);
            break;
        case 2: // Mur de gauche
            wall.rotation.y = Math.PI / 2;
            wall.position.set(-15, wallDimensions[1] / 2, 0);
            break;
        case 3: // Mur de droite
            wall.rotation.y = Math.PI / 2;
            wall.position.set(15, wallDimensions[1] / 2, 0);
            break;
    }
    scene.add(wall);
}

// Ajouter le cube (personnage)
const cubeSize = 1;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = (cubeSize / 2) + 1; // Pour le positionner sur le sol
scene.add(cube);

let cubeVelocity = new THREE.Vector3(); // Vitesse actuelle du cube


// Créer des boîtes englobantes pour le cube et les murs
const cubeBox = new THREE.Box3().setFromObject(cube);
const wallsBoxes = [];
scene.children.forEach(child => {
    if (child !== floor && child !== cube) {
        wallsBoxes.push(new THREE.Box3().setFromObject(child));
    }
});
const inputCooldown = {
    x: 0,
    z: 0
};
const cooldownDuration = 0.5; // Durée de désactivation de l'input en secondes
const bounceFactor = 0.8; // Facteur de rebond

function getCollisionFace(cube, wallBox) {
    const wallCenter = new THREE.Vector3();
    wallBox.getCenter(wallCenter);

    if (cubeVelocity.x > 0 && cube.position.x < wallCenter.x) {
        cubeVelocity.x = -cubeVelocity.x * bounceFactor;
        inputCooldown.x = cooldownDuration;
    } 
    if (cubeVelocity.x < 0 && cube.position.x > wallCenter.x) {
        cubeVelocity.x = -cubeVelocity.x * bounceFactor;
        inputCooldown.x = cooldownDuration;
    }
    if (cubeVelocity.z > 0 && cube.position.z < wallCenter.z) {
        cubeVelocity.z = -cubeVelocity.z * bounceFactor;
        inputCooldown.z = cooldownDuration;
    }
    if (cubeVelocity.z < 0 && cube.position.z > wallCenter.z) {
        cubeVelocity.z = -cubeVelocity.z * bounceFactor;
        inputCooldown.z = cooldownDuration;
    }

    camera.position.z = cube.position.z + 5;
    camera.lookAt(cube.position);
}



// Fonction pour vérifier les collisions
function checkCollision(position) {
    const testBox = cubeBox.clone().translate(position);
    for (let wallBox of wallsBoxes) {
        if (testBox.intersectsBox(wallBox)) {
            getCollisionFace(cube, wallBox)
            return true; // Collision détectée
        }
    }
    return false; // Pas de collision
}

const acceleration = 3; // Accélération du cube
// Vitesse de déplacement du cube
const cubeSpeed = 0.1;
const deceleration = 0.91; // Facteur de décélération (doit être < 1)


const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Gérer les entrées du clavier
document.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
});



// Position de la caméra
camera.position.y = 8;
camera.position.z = 10;
camera.lookAt(0, 0, 0);
// Rendu
// Fonction d'animation
function animate() {
    requestAnimationFrame(animate);

    // Mettre à jour les cooldowns
    inputCooldown.x = Math.max(0, inputCooldown.x - 1/60);
    inputCooldown.z = Math.max(0, inputCooldown.z - 1/60);

    // Mettre à jour la vitesse du cube en fonction des touches enfoncées
    if (keys.ArrowUp && inputCooldown.z === 0) cubeVelocity.z = -acceleration;
    else if (keys.ArrowDown && inputCooldown.z === 0) cubeVelocity.z = acceleration;
    else cubeVelocity.z *= deceleration;

    if (keys.ArrowLeft && inputCooldown.x === 0) cubeVelocity.x = -acceleration;
    else if (keys.ArrowRight && inputCooldown.x === 0) cubeVelocity.x = acceleration;
    else cubeVelocity.x *= deceleration;

    let move = cubeVelocity.clone().multiplyScalar(cubeSpeed);
    if (!checkCollision(move)) {
        cube.position.add(move);
        cubeBox.setFromObject(cube);

        camera.position.x = cube.position.x;
        camera.position.z = cube.position.z + 5;
        camera.lookAt(cube.position);
    }

    renderer.render(scene, camera);
}

animate();