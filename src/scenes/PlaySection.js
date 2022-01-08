import Section, { GUTTER, HSHIFT } from "./Section";

export default class PlaySection extends Section {
  constructor(scene, drawCount=1) {
    super(scene);
    this.name = "play";
    this.data.push({ stack: [] });
    this.setRule(0);
    this.drawCount = drawCount;
  }

  render(cardWidth, cardHeight, offsetX=0, offsetY=0) {
    let x = GUTTER+cardWidth/2+offsetX;
    let y = GUTTER+cardHeight/2+offsetY;

    const columnData = this.data[0];
    columnData.pos = { x, y }
    this.scene.add.rectangle(x, y, cardWidth, cardHeight).setStrokeStyle(1, 0x3D3D3D);
    return this;
  }

  canMove(card, sections) {
    const topCard = this.getTopCard(card.column);
    let result = sections.foundation.hasMatch(card);
    if(!result)
      result = sections.column.hasMatch(card, topCard.key == card.key)
    return result;
  }

  showThree() {
    let { x, y } = this.data[0].pos;
    const stack = this.data[0].stack;
    for(let i=stack.length-1,count=0;i>=0&&count<6;i--) {
      const card = stack[i];
      card.setPosition(x,y, card.open)
      if(count < 2) x -= HSHIFT;
      count++;
    }
  }

  doClick(card, sections) {
    const { targetSection=null, targetColumn=0 } = this.canMove(card, sections)
    if(targetSection) {
      this.remove(card.column);
      targetSection.add(card, targetColumn, card.open)
    }
  }

  async add(card, column, open, isInit=false) {
    await super.add(card, column, open, isInit);
    if(this.drawCount == 3) {
      this.showThree();
    }
  }

  remove(column) {
    const card = super.remove(column);
    if(this.drawCount == 3) {
      this.showThree();
    }
    return card;      
  }
}
