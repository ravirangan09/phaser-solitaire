
import { Scene, Math} from 'phaser';
import cardImages from './assets/*.svg';
import Button from './Button';
import Card from './Card';
import ColumnSection from './ColumnSection';
import DrawSection from './DrawSection';
import FoundationSection from './FoundationSection';
import PlaySection from './PlaySection';
import { GUTTER } from './Section';

const DRAW_COUNT = 3;
const BUTTON_WIDTH = 80;
const BUTTON_HEIGHT = 36;

export default class SolitaireGame extends Scene
{
  constructor() {
    super('solitaire-game')
  }

  preload() {
    for(const key in cardImages) {
      this.load.svg(key, cardImages[key])   
    }
  }

  async undoAction() {
    if(!this.moves.length) return false;
    const moveData = this.moves.pop()
    for(const { action, data } of moveData) {
      const { targetSection, targetColumn, key } = data;
      const { card, cardIndex } = targetSection.getCard(targetColumn, key);
      if(!card) {
        this.cameras.main.shake(500); //for debugging. should not happen
        console.log(this.moves)
        return false;
      }
      switch(action) {
      case "move":
        targetSection.remove(targetColumn, cardIndex);
        await data.sourceSection.add(card, data.sourceColumn, data.sourceOpen);
        break;
      case "close":
        card.show(false);
        break;
      }
    } //end for
  }

  async doAction(action) {
    switch(action.name) {
    case "reset":
        return await action.section.doAction(action.name, this.sections);
    case "undo":
      await this.undoAction();
      break;
    case "new":
      localStorage.removeItem('currentSet');  //remove prev card set\
      this.scene.stop();
      this.scene.restart();
      break;
    }
  }

  async doClick(gameObject) {
    //simple mutex to prevent multiple clicks on undo actions due to tween animation delays    
    if(this.running) return false; 
    try {
      this.running = true;
      const card = gameObject.getData('card');
      if(card) return await card.section.doClick(card, this.sections);
      const action = gameObject.getData('action');
      if(action) return await this.doAction(action);
    }
    finally {
      this.events.emit("undocomplete");
      this.running = false;
    }
    return false;
  }
  
  initEvents() {
    let moveCache = []
    this.events.on("undomove", d=>moveCache.unshift(d));
    this.events.on("undocomplete", ()=>{
      if(moveCache.length)
        this.moves.push(moveCache);
      moveCache = [];
    })
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

    //shutdown needed as scene.restart refreshes object and 
    //multiple handlers are active which need to be closed
    this.events.on("shutdown", ()=>{
      this.events.off("shutdown");
      this.events.off("undomove");
      this.events.off("undocomplete");
      this.input.off("drag");
      this.input.off("dragstart");
      this.input.off("dragend");
      this.input.off("gameobjectup");
      this.input.off("gameobjectdown");
    });
  }

  getCards() {
    let currentSet = JSON.parse(localStorage.getItem("currentSet"));
    if(!currentSet) {
      const frameNames = Object.keys(cardImages)
      frameNames.splice(frameNames.indexOf('BACK'), 1)
      currentSet = Math.RND.shuffle(frameNames)
      localStorage.setItem('currentSet', JSON.stringify(currentSet))
    }
    return currentSet
  }

  async renderCards() {
    this.currentSet = this.getCards();

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
    //render buttons
    ({ x, y } = ds.getPosition(0));
    x += firstCard.width + GUTTER;

    const undoButton = new Button(this, x, y, BUTTON_WIDTH, BUTTON_HEIGHT, "Undo", "undo")
    y += BUTTON_HEIGHT + GUTTER
    const newButton = new Button(this, x, y, BUTTON_WIDTH, BUTTON_HEIGHT, "New", "new", { labelColor: "green" })
    this.sections = { draw: ds, foundation: fs, play: ps, column: cs };
    await this.renderCards();
  }

  init() {
    this.moves = [];
    this.sections = {};
    this.running = false;
  }
  
  async create() {
    this.init();
    await this.render();
    this.initEvents();
  }
}
