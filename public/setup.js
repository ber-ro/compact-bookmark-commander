const importMap = {
  imports: {
    "react": "../lib/react.js",
  }
};

// const im = document.createElement('script');
// im.type = 'importmap';
// im.textContent = JSON.stringify(importMap);
// document.body.append(im);

const app = document.createElement('script');
app.type = 'module';
app.src = "App.js";
document.body.append(app);
