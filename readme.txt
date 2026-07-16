========================================================================
📋 HISTORIAL DE COMANDOS GIT UTILIZADOS Y SU EXPLICACIÓN
========================================================================

En esta sección se detallan los comandos de Git que se utilizaron para registrar,
confirmar y subir los cambios realizados en el proyecto a GitHub:

1. git status
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Muestra el estado actual del directorio de trabajo
     y del área de preparación (staging). Permite ver qué archivos han sido
     modificados, cuáles están listos para confirmarse (staged) y cuáles no
     tienen seguimiento aún (untracked).
   • Ejemplo de uso:
     git status

2. git diff <archivo>
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Muestra las diferencias exactas de código (línea
     por línea) entre los archivos de tu directorio de trabajo y el último
     commit o el área de preparación. En este caso se usó para revisar
     los cambios específicos en 'script.js'.
   • Ejemplo de uso:
     git diff script.js
     git diff -U1 script.js (muestra solo 1 línea de contexto alrededor del cambio)

3. git remote -v
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Muestra los nombres de los servidores remotos
     vinculados al repositorio local junto con sus URLs de acceso (fetch)
     y envío (push). Se usó para verificar que la URL de destino fuera
     'git@github.com:Felix12232/AppHorarioAmazon.git'.
   • Ejemplo de uso:
     git remote -v

4. git config user.name / git config user.email
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Consulta (o configura si se añaden valores) el 
     nombre y correo electrónico del usuario creador de los commits. 
     Esto asocia tu identidad local de Git a tus contribuciones.
   • Ejemplo de uso:
     git config user.name
     git config user.email

5. git add <archivos...>
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Añade los cambios de los archivos especificados
     al área de preparación (staging area), indicándole a Git que deseas 
     incluir esas modificaciones en el próximo commit.
   • Ejemplo de uso:
     git add script.js .gitignore

6. git commit -m "mensaje"
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Registra de manera permanente los cambios que
     estaban en el área de preparación en el historial local de Git,
     asociando un mensaje explicativo y descriptivo sobre el trabajo.
   • Ejemplo de uso:
     git commit -m "refactor: migrar de google.script.run a fetch API para llamadas a Google Apps Script y agregar .gitignore"

7. git push <remoto> <rama>
   ---------------------------------------------------------------------
   • ¿Para qué sirve?: Envía todos los commits realizados localmente en
     una rama específica al repositorio remoto. En este caso, subió los
     commits de la rama 'main' al servidor remoto 'origin' en GitHub.
   • Ejemplo de uso:
     git push origin main

========================================================================
Creado localmente el 16/07/2026.
