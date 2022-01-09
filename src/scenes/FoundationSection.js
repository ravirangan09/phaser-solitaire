import Section, { GUTTER } from "./Section";

export default class FoundationSection extends Section {
  constructor(scene) {
    super(scene);
    this.name = "foundation";
    for(let i=0;i<4;i++) {
      this.data.push({ stack: [] });
      this.setRule(i);
    }
  }

  render(cardWidth, cardHeight, offsetX=0, offsetY=0) {
    let x = GUTTER+cardWidth/2+offsetX;
    let y = GUTTER+cardHeight/2+offsetY;

    for(let i=0;i<4;i++) {
      const columnData = this.data[i];
      columnData.pos = { x, y }
      this.scene.add.rectangle(x, y, cardWidth, cardHeight).setStrokeStyle(1, 0x3D3D3D);
      x += (cardWidth + GUTTER);
    }
    return this;
  }

  setRule(column) {
    const columnData = this.data[column];
    if(columnData.stack.length) {
      const newCard = columnData.stack.at(-1);
      columnData.ruleValue = newCard.value + 1;
      columnData.ruleSuites = newCard.suite;
    }
    else {
      columnData.ruleValue = 1;
      columnData.ruleSuites = 'CSHD';
    }
  }

  hasMatch(card) {
    for(let i=0;i<4;i++) {
      if(this.data[i].ruleValue == card.value && 
          this.data[i].ruleSuites.includes(card.suite)) {
        return { targetSection: this, targetColumn: i, multiple: false };
      }
    }
    return false;
  }

  canMove(card, sections) {
    return sections.column.hasMatch(card, true);
  }

}
