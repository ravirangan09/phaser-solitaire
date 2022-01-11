import { Geom } from "phaser";

export default class Button {
  constructor(scene, x, y, width, height, label, actionName, { buttonBorderColor=0x696969, 
                                                buttonColor=0xC0C0C0, 
                                                buttonClickColor=0x00FF00,
                                                labelColor="blue"
                                              }={}) {
    this.scene = scene;
    const text = scene.add.text(x, y, label, { color: labelColor }).setInteractive()
                        .setData('action', { name: actionName });
    text.x += (width-text.width)/2
    text.y += (height-text.height)/2
    const g = scene.add.graphics();
    g.fillStyle(buttonColor).lineStyle(4, buttonBorderColor);
    const rect = new Geom.Rectangle(x, y, width, height)
    const isWithin = (hitArea, x, y)=>rect.contains(x,y)
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 8)
                        .setInteractive(rect, isWithin).setData('action', { name: actionName });
    g.strokeRoundedRect(x, y, width, height, 8);
    scene.children.bringToTop(text);
    scene.input.on("gameobjectdown", (pointer, gameobject) => {
      if(gameobject == text || gameobject == g) {
        g.lineStyle(4, buttonClickColor).strokeRoundedRect(x, y, width, height, 8);
      }
    });
    scene.input.on("gameobjectup", (pointer, gameobject) => {
      if(gameobject == text || gameobject == g) {
        g.lineStyle(4, buttonBorderColor).strokeRoundedRect(x, y, width, height, 8);
      }
    });
  }
}
