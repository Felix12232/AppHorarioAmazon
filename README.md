# 📊 Control de Horas de Trabajo y Salario

> Aplicación web para el registro de jornadas laborales, cálculo automático de salarios y generación de estadísticas, utilizando **Google Sheets como base de datos** y **Google Apps Script como backend**.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Google%20Sheets](https://img.shields.io/badge/database-Google%20Sheets-success)
![Google%20Apps%20Script](https://img.shields.io/badge/backend-Apps%20Script-orange)

---

# ✨ Características

* 📅 Fecha automática al abrir la aplicación.
* ⏰ Horarios predefinidos:

  * Normal: **17:00 - 23:00**
  * Especial: **15:30 - 23:00**
  * Personalizado.
* ➕ Registro de horas extras.
* 💰 Precio por hora configurable (por defecto **9,90 €**).
* 🧮 Cálculo automático de:

  * Horas trabajadas.
  * Horas extras.
  * Horas totales.
  * Salario diario.
* 💾 Persistencia de datos en Google Sheets.
* 📈 Estadísticas mensuales.
* 📊 Gráficos interactivos.
* ✏️ Edición de registros.
* 🗑️ Eliminación de registros.
* 📱 Diseño responsive para móviles y escritorio.

---

# 🖼️ Capturas de Pantalla

## Registro de Jornada

```text
┌─────────────────────────┐
│ Fecha: 15/06/2026       │
│ Horario: Normal         │
│ Extras: 1.5 horas       │
│ Salario: 74.25 €        │
└─────────────────────────┘
```

## Estadísticas

```text
┌─────────────────────────┐
│ Horas del mes: 132      │
│ Salario: 1306.80 €      │
│ Días trabajados: 22     │
└─────────────────────────┘
```

---

# 🏗️ Arquitectura

```text
Aplicación Web
      │
      ▼
Google Apps Script
      │
      ▼
Google Sheets
```

---

# 🛠️ Tecnologías

| Tecnología         | Uso               |
| ------------------ | ----------------- |
| HTML5              | Estructura        |
| CSS3               | Diseño Responsive |
| JavaScript         | Lógica de negocio |
| Chart.js           | Gráficas          |
| Google Apps Script | Backend           |
| Google Sheets      | Base de datos     |

---

# 📁 Estructura del Proyecto

```text
control-horas/
│
├── index.html
├── style.css
├── app.js
├── Code.gs
├── README.md
└── assets/
    └── screenshots/
```

---

# 🚀 Instalación

## 1. Crear la hoja de cálculo

Crea una nueva hoja de cálculo en Google Drive.

Nombre sugerido:

```text
HorarioAmazon
```

Columnas:

| A     | B       | C      | D      | E     | F       |
| ----- | ------- | ------ | ------ | ----- | ------- |
| FECHA | ENTRADA | SALIDA | EXTRAS | HORAS | SALARIO |

---

## 2. Obtener el ID de la hoja

Ejemplo:

```text
https://docs.google.com/spreadsheets/d/12UEBQwcO8AdX-VC6gzDI-HB14a55fgGPJ6YuuhzcPV4/edit
```

El ID es:

```text
12UEBQwcO8AdX-VC6gzDI-HB14a55fgGPJ6YuuhzcPV4
```

---

## 3. Configurar Google Apps Script

Abrir:

```text
Extensiones → Apps Script
```

Configurar:

```javascript
const SPREADSHEET_ID = 'TU_ID';
```

---

## 4. Implementar la Web App

```text
Implementar
    └── Nueva implementación
            └── Aplicación web
```

Configuración:

```text
Ejecutar como: Yo
Acceso: Cualquiera
```

Copiar la URL generada.

---

## 5. Configurar el Frontend

En `app.js`:

```javascript
const SCRIPT_URL =
'https://script.google.com/macros/s/TU_URL/exec';
```

---

# 🌐 Despliegue

## GitHub Pages

1. Crear repositorio.
2. Subir archivos.
3. Ir a:

```text
Settings → Pages
```

4. Seleccionar:

```text
Branch: main
Folder: /root
```

La aplicación quedará disponible en:

```text
https://usuario.github.io/control-horas/
```

---

## Netlify

1. Entrar en Netlify.
2. Arrastrar la carpeta del proyecto.
3. Obtendrás una URL automáticamente.

---

## Vercel

1. Importar el repositorio.
2. Desplegar.
3. URL generada automáticamente.

---

# 🎯 Funcionalidades

## Registrar jornada

* Fecha automática.
* Selección de horario.
* Horas extras.
* Cálculo automático.
* Guardado en Google Sheets.

---

## Estadísticas

* Horas trabajadas por mes.
* Salario acumulado.
* Días trabajados.
* Histórico mensual.
* Gráficos.

---

## Gestión de registros

### Editar

```text
✏️ Editar una jornada.
```

### Eliminar

```text
🗑️ Eliminar una jornada.
```

---

# 📊 Estructura de Datos

| Campo         | Tipo    |
| ------------- | ------- |
| Fecha         | Date    |
| Entrada       | Time    |
| Salida        | Time    |
| Horas Extras  | Decimal |
| Horas Totales | Decimal |
| Salario Día   | Decimal |

---

# 🔧 Solución de Problemas

## No se guardan datos

* Verificar `SPREADSHEET_ID`.
* Verificar permisos.
* Revisar consola del navegador.

---

## Error de conexión

* Verificar `SCRIPT_URL`.
* Volver a implementar Apps Script.

---

## Error CORS

Configurar la Web App como:

```text
Acceso: Cualquiera
```

---

# 📱 Compatibilidad

* ✅ Chrome
* ✅ Edge
* ✅ Firefox
* ✅ Safari
* ✅ Opera
* ✅ Android
* ✅ iPhone

---

# 🚀 Roadmap

## v1.1

* [ ] Exportar a PDF.
* [ ] Modo oscuro.
* [ ] Mejoras visuales.

## v1.2

* [ ] Reportes semanales.
* [ ] Backup automático.

## v2.0

* [ ] Múltiples usuarios.
* [ ] Sistema de autenticación.
* [ ] Aplicación PWA instalable.

---

# 🤝 Contribuciones

Las contribuciones son bienvenidas.

```bash
git clone
git checkout -b feature/nueva-funcionalidad
git commit
git push
```

Abrir un Pull Request.

---

# 📄 Licencia

Distribuido bajo licencia MIT.

---

# 👨‍💻 Autor

Desarrollado para la gestión y control de horas de trabajo y salarios mediante Google Sheets y Google Apps Script.

---

# ⭐ Si te gusta este proyecto

Dale una estrella al repositorio y compártelo.
