# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Ramas de escenificación

Each release line has a staging branch that the releaser will use as a scratch pad while preparing a release. The branch name is formatted as follows: `vN.x-staging` where `N` is the major release number.

*Nota*: Para las ramas de escenificación activas vea el [Calendario de Lanzamiento](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita recibir un backport?

If a cherry-pick from master does not land cleanly on a staging branch, the releaser will mark the pull request with a particular label for that release line (e.g. `backport-requested-vN.x`), specifying to our tooling that this pull request should not be included. The releaser will then add a comment requesting that a backport pull request be made.

## ¿A qué se le puede hacer backport?

The "Current" release line is much more lenient than the LTS release lines in what can be landed. Our LTS release lines (see the [Release Plan](https://github.com/nodejs/Release#release-plan)) require that commits mature in the Current release for at least 2 weeks before they can be landed in an LTS staging branch. Only after "maturation" will those commits be cherry-picked or backported.

## Cómo enviar una pull request de backport

For the following steps, let's assume that a backport is needed for the v6.x release line. All commands will use the `v6.x-staging` branch as the target branch. In order to submit a backport pull request to another branch, simply replace that with the staging branch for the targeted release line.

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

4. Después de crear la rama, aplique los cambios a la rama. The cherry-pick will likely fail due to conflicts. In that case, you will see something like this:

```shell
# Diga que $SHA es 773cdc31ef
$ git cherry-pick $SHA # Use su hash de commit 
error: podría no aplicar 773cdc3... <commit title>
pista: después de resolver los conflictos, marque las rutas corregidas 
pista: con 'git add <paths>' or 'git rm <paths>
pista: y realice un commit de los resultados con 'git commit'
```

5. Make the required changes to remove the conflicts, add the files to the index using `git add`, and then commit the changes. That can be done with `git cherry-pick --continue`.
6. Deje el mensaje del commit como está. If you think it should be modified, comment in the Pull Request.
7. Asegúrese de que `make -j4 test` pase.
8. Impulse los cambios a su bifurcación
9. Abra una pull request: 
    1. Asegúrese de apuntar a la rama `v6.x-staging` en la pull request.
    2. Include the backport target in the pull request title in the following format — `[v6.x backport] <commit title>`. Ejemplo: `proceso [v6.x backport]: mejorar el rendimiento de nextTick`
    3. Compruebe la casilla de verificación etiquetada como "Permitir ediciones de mantenedores".
    4. En la descripción añada una referencia a la PR original
    5. Run a [`node-test-pull-request`][] CI job (with `REBASE_ONTO` set to the default `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v6.x-staging`

After the PR lands replace the `backport-requested-v6.x` label on the original PR with `backported-to-v6.x`.