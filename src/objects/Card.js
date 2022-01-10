const TWEEN_DURATION = 50;
const CARD_SCALE = 0.4;

export default class Card {
  constructor(scene, key) {
    this.key = key;
    this.scene = scene;
    this.init();
  }

  init() {
    const lookup = { 'A': 1, 'T': 10, 'J': 11, 'Q': 12, 'K': 13 };
    const numStr = this.key[0];
    this.suite = this.key[1];
    this.color = (this.suite == 'C' || this.suite == 'S') ? 'black' : 'red'; 
    // eslint-disable-next-line no-prototype-builtins
    this.value = lookup.hasOwnProperty(numStr) ? lookup[numStr] : parseInt(numStr);
    this.image = this.scene.add.image(0, 0, 'BACK').setScale(CARD_SCALE)
                          .setVisible(false).setInteractive();
    this.image.setData('card', this);
    this.open = false;
    this.openTextureKey = this.key; 
    this.closeTextureKey = 'BACK';
    this.setLocation('none', 0)
  }

  get width() {
    return this.image.displayWidth;
  }

  get height() {
    return this.image.displayHeight;
  }

  setPosition(x, y, open) {
    this.open = open;
    this.image.setPosition(x,y).setVisible(true)
      .setTexture(open ? this.openTextureKey : this.closeTextureKey);
    this.scene.input.setDraggable(this.image, open)
  }

  setLocation(section, column) {
    this.section = section;
    this.column = column;
  }
  
  show(open) {
    if(open && !this.open) {
      this.image.setTexture(this.openTextureKey);
      this.scene.input.setDraggable(this.image);
    }
    if(!open && this.open) {
      this.image.setTexture(this.closeTextureKey);
      this.scene.input.setDraggable(this.image, false)
    }
    this.open = open;
    this.scene.children.bringToTop(this.image)
  }

  async moveTo(x, y, open) {
    this.show(open);
    return new Promise(resolve=>this.scene.tweens.add({
                              targets: this.image,
                              duration: TWEEN_DURATION,
                              x,
                              y,
                              onComplete: ()=>resolve(true)
                            })
                      );
  }

}
