export default ({ body, title, initialState }) => {
  return `
      <!DOCTYPE html>
      <html>
        <style>
          @import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
        </style>
        <head>
          <script>window.__APP_INITIAL_STATE__ = ${initialState}</script>
          <title>${title}</title>
          <link rel="stylesheet" href="/assets/css/bundle.css" />
        </head>
        
        <body>
          <!-- Helper for browser refresh during dev -->
          <script src="${process.env.BROWSER_REFRESH_URL}"></script>
          <div id="root">${body}</div>
        </body>
        
        <script src="/assets/bundle.js"></script>
      </html>
    `;
};