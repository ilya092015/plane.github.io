const plane = document.getElementById('plane');
const gameContainer = document.querySelector('.game-container');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const shootSound = document.getElementById('shoot-sound');
const explosionSound = document.getElementById('explosion-sound');
const backgroundMusic = document.getElementById('background-music');
const rocketChargesElement = document.getElementById('rocket-charges');

let planeX = window.innerWidth / 2;
let planeY = window.innerHeight / 2;
let score = 0;
let rocketCharges = 0;
let gameOver = false;
let balloonSpeed = 2;
let balloonIntervalTime = 2000;
let planeAngle = 0;
let velocityX = 0;
let velocityY = 0;
const acceleration = 0.2;
const friction = 0.98;
const maxSpeed = 5;

const tracks = [
    'music1.mp3',
    'music2.mp3',
    'music3.mp3',
    'music4.mp3',
    'music5.mp3'
];

let currentTrackIndex = 0;

function playRandomTrack() {
    if (currentTrackIndex >= tracks.length) {
        currentTrackIndex = 0;
    }

    backgroundMusic.src = tracks[currentTrackIndex];
    backgroundMusic.play();

    backgroundMusic.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        playRandomTrack();
    });
}

document.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        playRandomTrack();
    }
});

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener('keydown', (event) => {
    if (gameOver) return;

    if (event.key in keys) {
        keys[event.key] = true;
    }

    if (event.key === ' ') {
        shoot();
    }

    if (event.key === 'Shift') {
        shootRocket();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key in keys) {
        keys[event.key] = false;
    }
});

function updatePlaneMovement() {
    if (keys.ArrowLeft) velocityX -= acceleration;
    if (keys.ArrowRight) velocityX += acceleration;
    if (keys.ArrowUp) velocityY -= acceleration;
    if (keys.ArrowDown) velocityY += acceleration;

    velocityX = Math.max(-maxSpeed, Math.min(maxSpeed, velocityX));
    velocityY = Math.max(-maxSpeed, Math.min(maxSpeed, velocityY));

    velocityX *= friction;
    velocityY *= friction;

    planeX += velocityX;
    planeY += velocityY;

    planeX = Math.max(0, Math.min(window.innerWidth - 100, planeX));
    planeY = Math.max(0, Math.min(window.innerHeight - 50, planeY));

    if (velocityX !== 0 || velocityY !== 0) {
        planeAngle = Math.atan2(velocityY, velocityX) * (180 / Math.PI) + 90;
    }

    plane.style.left = `${planeX}px`;
    plane.style.top = `${planeY}px`;
    plane.style.transform = `rotate(${planeAngle}deg)`;
}

function shoot() {
    shootSound.volume = 0.1;
    shootSound.currentTime = 0;
    shootSound.play();

    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${planeX + 20}px`;
    bullet.style.top = `${planeY}px`;
    gameContainer.appendChild(bullet);

    const angleRad = (planeAngle - 90) * (Math.PI / 180); // Исправлено направление пуль
    const bulletSpeed = 10;

    const bulletInterval = setInterval(() => {
        const bulletX = parseFloat(bullet.style.left) || planeX + 45;
        const bulletY = parseFloat(bullet.style.top) || planeY;

        bullet.style.left = `${bulletX + bulletSpeed * Math.cos(angleRad)}px`;
        bullet.style.top = `${bulletY + bulletSpeed * Math.sin(angleRad)}px`;

        if (
            bulletX < 0 || bulletX > window.innerWidth ||
            bulletY < 0 || bulletY > window.innerHeight
        ) {
            clearInterval(bulletInterval);
            bullet.remove();
        } else {
            checkCollision(bullet);
        }
    }, 20);
}

function shootRocket() {
    if (rocketCharges > 0) {
        rocketCharges--;
        updateRocketCharges();

        const rocket = document.createElement('div');
        rocket.classList.add('rocket');
        rocket.style.left = `${planeX + 35}px`;
        rocket.style.top = `${planeY}px`;
        gameContainer.appendChild(rocket);

        const rocketInterval = setInterval(() => {
            const rocketTop = parseFloat(rocket.style.top) || planeY;

            rocket.style.top = `${rocketTop - 10}px`;

            const rocketRect = rocket.getBoundingClientRect();
            const balloons = document.querySelectorAll('.balloon, .charge-balloon');

            balloons.forEach(balloon => {
                const balloonRect = balloon.getBoundingClientRect();
                if (
                    rocketRect.left + 10 < balloonRect.right - 10 &&
                    rocketRect.right - 10 > balloonRect.left + 10 &&
                    rocketRect.top + 10 < balloonRect.bottom - 10 &&
                    rocketRect.bottom - 10 > balloonRect.top + 10
                ) {
                    explodeRocket(rocketRect.left, rocketRect.top);
                    clearInterval(rocketInterval);
                    rocket.remove();
                }
            });

            if (rocketTop < 0) {
                clearInterval(rocketInterval);
                rocket.remove();
            }
        }, 20);
    }
}

function explodeRocket(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    gameContainer.appendChild(explosion);

    const balloons = document.querySelectorAll('.balloon, .charge-balloon');
    const explosionRadius = 100;

    balloons.forEach(balloon => {
        const balloonRect = balloon.getBoundingClientRect();
        const distance = Math.sqrt(
            Math.pow(balloonRect.left - x, 2) + Math.pow(balloonRect.top - y, 2)
        );

        if (distance < explosionRadius) {
            balloon.remove();
            score += 1;
            scoreElement.textContent = `Счет: ${score}`;
        }
    });

    setTimeout(() => {
        explosion.remove();
    }, 500);
}

function createChargeBalloon() {
    const chargeBalloon = document.createElement('div');
    chargeBalloon.classList.add('charge-balloon');
    chargeBalloon.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
    chargeBalloon.style.top = '0';
    gameContainer.appendChild(chargeBalloon);

    const chargeBalloonInterval = setInterval(() => {
        const chargeBalloonTop = parseInt(chargeBalloon.style.top) || 0;

        if (chargeBalloonTop > window.innerHeight) {
            clearInterval(chargeBalloonInterval);
            chargeBalloon.remove();
        } else {
            chargeBalloon.style.top = `${chargeBalloonTop + 2}px`;
            checkPlaneCollision(chargeBalloon);
        }
    }, 20);
}

function checkPlaneCollision(balloon) {
    const planeRect = plane.getBoundingClientRect();
    const balloonRect = balloon.getBoundingClientRect();

    if (
        planeRect.left + 20 < balloonRect.right - 20 &&
        planeRect.right - 20 > balloonRect.left + 20 &&
        planeRect.top + 20 < balloonRect.bottom - 20 &&
        planeRect.bottom - 20 > balloonRect.top + 20
    ) {
        if (balloon.classList.contains('charge-balloon')) {
            rocketCharges += 1;
            updateRocketCharges();
        }
        explodePlane();
    }
}

function checkCollision(bullet) {
    const balloons = document.querySelectorAll('.balloon');
    const bulletRect = bullet.getBoundingClientRect();

    balloons.forEach(balloon => {
        const balloonRect = balloon.getBoundingClientRect();
        if (
            bulletRect.left < balloonRect.right &&
            bulletRect.right > balloonRect.left &&
            bulletRect.top < balloonRect.bottom &&
            bulletRect.bottom > balloonRect.top
        ) {
            balloon.remove();
            bullet.remove();
            score += 1;
            scoreElement.textContent = `Счет: ${score}`;
        }
    });
}

function explodePlane() {
    gameOver = true;
    explosionSound.play();
    gameOverElement.style.display = 'block';

    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${planeX}px`;
    explosion.style.top = `${planeY}px`;
    gameContainer.appendChild(explosion);

    plane.remove();

    setTimeout(() => {
        explosion.remove();
    }, 500);
}

setInterval(createChargeBalloon, 10000);

function createBalloon() {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
    balloon.style.top = '0';
    gameContainer.appendChild(balloon);

    const balloonInterval = setInterval(() => {
        if (gameOver) {
            clearInterval(balloonInterval);
            return;
        }

        const balloonTop = parseInt(balloon.style.top) || 0;
        if (balloonTop > window.innerHeight) {
            clearInterval(balloonInterval);
            balloon.remove();
        } else {
            balloon.style.top = `${balloonTop + balloonSpeed}px`;
            checkPlaneCollision(balloon);
        }
    }, 20);
}

setInterval(createBalloon, balloonIntervalTime);

function gameLoop() {
    if (!gameOver) {
        updatePlaneMovement();
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();