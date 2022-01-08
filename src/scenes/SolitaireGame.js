
import { Scene, Math } from 'phaser';
import cardImages from './assets/*.svg';
import Card from './Card';
import ColumnSection from './ColumnSection';
import DrawSection from './DrawSection';
import FoundationSection from './FoundationSection';
import PlaySection from './PlaySection';
import { GUTTER } from './Section';

const DRAW_COUNT = 3;

export default class SolitaireGame extends Scene
{
  constructor() {
    super('solitaire-game')
    this.moves = [];
    this.sections = {};
  }

  preload() {
    for(const key in cardImages) {
      this.load.svg(key, cardImages[key])   
    }
  }

  doClick(gameObject) {
    const card = gameObject.getData('card');
    if(card) return card.section.doClick(card, this.sections);
    const action = gameObject.getData('action');
    if(action) return action.section.doAction(action.name, this.sections);
    return false;
  }

  initEvents() {
    this.input.dragDistanceThreshold = 5;
    this.input.on('dragstart', (pointer, gameObject)=>{
      this.children.bringToTop(gameObject);
      gameObject.setData("isDragging", true)
    })

    this.input.on('drag', (pointer, gameObject, dragX, dragY)=>{
      gameObject.x = dragX;
      gameObject.y = dragY;
    })


    this.input.on('dragend', (pointer, gameObject, dropped) => {
      if (!dropped) {
        const card = gameObject.getData('card');
        card.moveTo(gameObject.input.dragStartX, gameObject.input.dragStartY, card.open)
      }
    });

    this.input.on('gameobjectup', (pointer, gameObject) => {
      const isDragging = gameObject.getData("isDragging")
      if(!isDragging) {
        this.doClick(gameObject);
      }
      gameObject.setData("isDragging", false)
    });

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      gameObject.setData("isDragging", false)
    });
  }

  async renderCards() {
    const frameNames = Object.keys(cardImages)
    frameNames.splice(frameNames.indexOf('BACK'), 1)
    this.currentSet = Math.RND.shuffle(frameNames)

    const { draw: ds, column: cs } = this.sections;

    for(let i=0;i<52;i++) {
      const card = new Card(this, this.currentSet[i]);
      ds.add(card, 0, false, true)
    }
    //move some to column
    for(let column=0;column<7;column++) {
      for(let i=0;i<column+1;i++) {
        const card = ds.remove(0);
        await cs.add(card, column, i == column)
      }
    }
  }

  async render() {
    const firstCard = new Card(this, 'AS'); //ace spade
    const fs = new FoundationSection(this).render(firstCard.width, 
                                                        firstCard.height);

    let { x, y } = fs.getPosition(0);
    y += firstCard.height/2 + GUTTER;

    const cs = new ColumnSection(this).render(firstCard.width, 
                                                        firstCard.height,
                                                        0,
                                                        y
                                                      );

    ({ x, y } = cs.getPosition(6));
    x -= (firstCard.width/2 + GUTTER);
    const ds = new DrawSection(this, DRAW_COUNT).render(firstCard.width, 
      firstCard.height,
      x,
      0
    );

    ({ x, y } = ds.getPosition(0));
    x -= (firstCard.width + GUTTER + firstCard.width/2 + GUTTER);
    const ps = new PlaySection(this, DRAW_COUNT).render(firstCard.width, 
      firstCard.height,
      x,
      0
    );
    this.sections = { draw: ds, foundation: fs, play: ps, column: cs };
    this.renderCards();
  }

  async create() {
    await this.render();
    this.initEvents();
  }
}
