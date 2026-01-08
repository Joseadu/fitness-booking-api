const fs = require('fs');
const path = require('path');

const moves = [
    { from: 'src/athletes/entities/profile.entity.ts', to: 'src/users/entities/profile.entity.ts' },
    { from: 'src/athletes/entities/box-membership.entity.ts', to: 'src/memberships/entities/box-membership.entity.ts' }
];

moves.forEach(({ from, to }) => {
    const targetDir = path.dirname(to);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Created dir: ${targetDir}`);
    }
    if (fs.existsSync(from)) {
        fs.renameSync(from, to);
        console.log(`Moved ${from} -> ${to}`);
    } else {
        console.log(`Source not found: ${from}`);
    }
});
