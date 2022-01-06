import { Game, AUTO } from 'phaser'

import SolitaireGame from './scenes/SolitaireGame'

const config = {
	type: AUTO,
	width: '100%',
	height: '100%',
	parent: 'game',
	backgroundColor: 0x008000,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 }
		}
	},
	scene: [SolitaireGame]
}

export default new Game(config)