import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import serve from 'koa-static';
import mount from 'koa-mount';
import fs from 'fs';

import render from './render';
import api from './api';

const app = new Koa();
const router = new Router();

app.cache = new Map();
app.cache.set('page-500', fs.readFileSync('./template/500.html').toString());
app.cache.set('page-index', fs.readFileSync('./template/index.html').toString());

router
    .get('/api/*', async ctx => {
        ctx.body = await api.any(ctx.url);
    })
    .get('/', async (ctx, next) => {
        // 初始化数据首页数据
        await Promise.all([
            api.any('/api/columns/qianduanzhidian'),
            api.any('/api/columns/qianduanzhidian/posts'),
        ]).then(([info, list]) => {
            // 专栏信息, 专栏文章列表
            ctx.state = { info, list };
        });
        await next();
    })
    .get('/detail/:id', async (ctx, next) => {
        // 初始化详细页数据
        ctx.state = await api.detail(ctx.params.id);
        await next();
    })
    .get('/*', async (ctx, next) => {
        await render(ctx, 'main')
            .then(res => ctx.body = res)
            .catch(err => {
                console.error(err);
                ctx.status = 500;
                ctx.body = ctx.app.cache.get('page-500');
            });
    })
    ;

app
    .use(logger())
    .use(mount('/static', serve('./public')))
    .use(router.routes())
    .listen(3000, () => {
        console.log('server run in 3000.');
    });



