import Section, { GUTTER } from "./Section";

export default class DrawSection extends Section {
  constructor(scene, drawCount=1) {
    super(scene);
    this.name = "draw";
    this.data.push({ stack: [] });
    this.setRule(0);
    this.drawCount = drawCount;
  }

  render(cardWidth, cardHeight, offsetX=0, offsetY=0) {
    let x = GUTTER+cardWidth/2+offsetX;
    let y = GUTTER+cardHeight/2+offsetY;

    const columnData = this.data[0];
    columnData.pos = { x, y }
    this.scene.add.rectangle(x, y, cardWidth, cardHeight).setStrokeStyle(1, 0x3D3D3D)
      .setInteractive()
      .setData('action', { name: 'reset', section: this });
    return this;
  }

  async doAction(name, sections) {
    const playSection = sections.play;
    for(;;) {
      const card = playSection.getTopCard(0);
      if(!card) break;
      playSection.remove(0)
      await this.add(card, 0, false)
    }
  }
  

  canMove(card, sections) {
    return { targetSection: sections.play, targetColumn: 0 };
  }

  async doClick(card, sections) {
    const { targetSection=null, targetColumn=0 } = this.canMove(card, sections)
    if(targetSection) {
      for(let i=0;i<this.drawCount;i++) {
        const moveCard = this.remove(card.column);
        await targetSection.add(moveCard, targetColumn, true);
      }
    }
  }

}
