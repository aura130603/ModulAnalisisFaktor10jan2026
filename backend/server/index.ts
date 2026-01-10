import { app } from './app';
import { PORT } from './config/constants';

app.listen(PORT, () => {
    console.warn(`Server berjalan pada http://localhost:${PORT}`);
});