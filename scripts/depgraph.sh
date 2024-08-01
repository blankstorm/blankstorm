mkdep() {
	madge --extensions ts --image "tmp/deps/$1.svg" $2
}
mkdep.all() {
	mkdep all src/index.ts
}
mkdep.core() {
	mkdep core src/core/index.ts
}
mkdep.client() {
	mkdep client src/client/index.ts
}
mkdep.server() {
	mkdep server src/server/index.ts
}
mkdep.server-cli() {
	mkdep server-cli src/server/cli.ts
}
mkdeps() {
	mkdep.all
	mkdep.core
	mkdep.client
	mkdep.server 
	mkdep.server-cli
}
export -f mkdep.all mkdep.core mkdep.client mkdep.server mkdep.server-cli mkdeps