# vue

## environment

```shell
cnpm init vite
```

```shell
cd XXX
cnpm install
```

## start

```shell
npm run dev
```

# electron

## environment

```shell
cnpm install electron
```

# dev tools

```shell
cnpm install nodemon
```

在package.json中的script中加入
```json
"start": "nodemon --exec electron . --watch ./ --ext .js, .html, .css, .vue"
```
删掉
```json
"type":module
```

```shell
npm start
```

建议关闭 vscode 自动保存

```shell
cnpm install electron-win-state
```
