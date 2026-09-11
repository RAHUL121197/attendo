import { app } from './app.js';
import { assertRuntimeConfig, config } from './config.js';

assertRuntimeConfig();
app.listen(config.port, () => {
  console.log(`Attendo API listening on http://localhost:${config.port}`);
});
