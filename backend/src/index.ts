import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en el puerto ${PORT}`);
  console.log(`📑 Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
});
