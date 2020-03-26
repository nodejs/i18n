# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Ramas de escenificación

Cada línea de la release tiene un branch de staging que el publicador usará como un bloc de notas al preparar la release. El nombre del branch tiene el siguiente formato: `vN.x-staging`, donde `N` es el número del major release.

*Nota*: Para los branch de staging activos vea el [Calendario de Release](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita recibir un backport?

Si un cherry-pick de master no aterriza limpiamente en una rama de escenificación, el publicador marcará la pull request con una etiqueta particular para esa línea de lanzamiento (por ejemplo: `backport-requested-vN.x`), especificando a nuestras herramientas que esta pull request no debe ser incluida. Entonces, el publicador agregará un comentario solicitando que se realice un backport para una pull request.

## ¿A qué se le puede hacer backport?

La línea de lanzamiento "Actual" es mucho más indulgente que las líneas de lanzamiento LTS en lo que se puede aterrizar. Nuestras líneas de lanzamiento LTS (vea el [Plan de Lanzamiento](https://github.com/nodejs/Release#release-plan)) requieren que los commits maduren en el lanzamiento Actual por al menos 2 semanas antes de que puedan aterrizar en una rama de escenificación de LTS. Solo después de la "maduración" a esos commits se les podrá hacer cherry-pick o backport.

## Cómo enviar una pull request de backport

Para los siguientes pasos, vamos a suponer que es necesario un backport para la línea de lanzamiento v6.x. Todos los comandos usarán la rama `v6.x-staging` como la rama objetivo. Para enviar una pull request de backport a otra rama, simplemente reemplácela con la rama de escenificación para la línea de lanzamiento hacia la que está dirigida.

1. Compruebe la rama de escenificación para la línea de lanzamiento especificada
2. Asegúrese de que la rama de escenificación local esté actualizada con el remoto
3. Cree una nueva rama fuera de la rama de escenificación

```shell
# Asumiendo que su bifurcación de Node.js es verificada en $NODE_DIR,
# el remoto de origen señala a su bifurcación, y el remoto upstream señala
# a git://github.com/nodejs/node
cd $NODE_DIR
# Si v6.x-staging es verificado, debe usarse `pull` en lugar de` fetch`
git fetch upstream v6.x-staging:v6.x-staging -f
# Suponiendo que queremos realizar un backport para la PR #10157
git checkout -b backport-10157-to-v6.x v6.x-staging
# Asegúrese de que no haya artefactos de prueba de compilaciones anteriores
# Tenga en cuenta que este comando elimina todos los archivos y directorios
# que no están bajo el control de revisión de ./test directory.
# Es opcional y debe ser usado con precaución.
git clean -xfd ./test/
```

4. Después de crear la rama, aplique los cambios a la rama. El cherry-pick probablemente fallará debido a los conflictos. En ese caso, verá algo así:

```shell
# Diga que $SHA es 773cdc31ef
$ git cherry-pick $SHA # Use su hash de commit 
error: podría no aplicar 773cdc3... <commit title>
pista: después de resolver los conflictos, marque las rutas corregidas 
pista: con 'git add <paths>' or 'git rm <paths>
pista: y realice un commit de los resultados con 'git commit'
```

5. Realice los cambios requeridos para eliminar los conflictos, añada los archivos al índice usando `git add`, y luego plasme los cambios vía commit. Eso se puede hacer con `git cherry-pick --continue`.
6. Deje el mensaje del commit como está. Si piensa que debe ser modificado, comente en la Pull Request.
7. Asegúrese de que `make -j4 test` pase.
8. Impulse los cambios a su bifurcación
9. Abra una pull request:
   1. Asegúrese de apuntar a la rama `v6.x-staging` en la pull request.
   2. Incluya el objetivo del backport en el título de la pull request en el siguiente formato — `[v6.x backport] <commit title>`. Ejemplo: `proceso [v6.x backport]: mejorar el rendimiento de nextTick`
   3. Compruebe la casilla de verificación etiquetada como "Permitir ediciones de mantenedores".
   4. En la descripción añada una referencia a la PR original
   5. Ejecute un trabajo de CI [`node-test-pull-request`][] (con `REBASE_ONTO` establecido en el valor predeterminado `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v6.x-staging`

Después de que aterrice la PR, reemplace la etiqueta `backport-requested-v6.x` en la PR original con `backported-to-v6.x`.
