var _data = require('./lib/data');

items = [
    { 'id': 13, 'size': 'M', 'quantity': 2 },
    { 'id': 13, 'size': 'S', 'quantity': 2 },
    { 'id': 1, 'size': 'M', 'quantity': 3 }
]

_data.read('', 'menu', function (err, menuData) {
    if (!err && menuData) {
        const menuList = menuData.map(obj => obj.id);
        if (items.every(i => menuList.indexOf(i.id) > -1 )) {
            const {countItem, totalPrice} = items.reduce(({count, total}, i) => {
                return {
                    count: count + i.quantity,
                    total: total + menuData[i.id].price[i.size] * i.quantity
                };
            }, 0);
            const orderObject = {
                'item': countItem,
                'total': totalPrice
            }
            console.log(orderObject);
        } else {
            console.log("Shooping cart contains item not available in menu");
        }
    } else {
        console.log("Could not get menu data");
    }
})