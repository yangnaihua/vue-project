var express = require('express');
var router = express.Router();
var User = require('./../models/user')
require('./../util/dataFormat')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

//登录接口
router.post('/login', function (req, res, next) {
  var param = {
    userName: req.body.userName,
    userPwd: req.body.userPwd
  }
  User.findOne(param, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message
      })
    } else {
      if (doc) {
        //存放到cookis中
        res.cookie('userId', doc.userId, {
          path: '/',
          maxAge: 1000 * 60 * 60
        })
        res.cookie('userName', doc.userName, {
          path: '/',
          maxAge: 1000 * 60 * 60
        })
        //存放到session中，需要安装插件
        //req.session.user = doc
        res.json({
          status: '0',
          msg: '',
          result: {
            userName: doc.userName
          }
        })
      } else {
        res.json({
          status: '1',
          msg: ''
        })
      }
    }
  })
})

//登出接口
router.post('/logout', function (req, res, next) {
  res.cookie('userId', '', {
    path: '/',
    maxAge: -1
  })
  res.json({
    status: '0',
    msg: '',
    result: ''
  })
})

//登录验证
router.get('/checkLogin', function (req, res, next) {
  if (req.cookies.userId) {
    res.json({
      status: '0',
      msg: '',
      result: {
        userName: req.cookies.userName
      }
    })
  } else {
    res.json({
      status: '1',
      msg: '未登录',
      result: ''
    })
  }
})

//获取购物车列表
router.get('/cartList', function (req, res, next) {
  var userId = req.cookies.userId;
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (doc) {
        res.json({
          status: '0',
          msg: '',
          result: doc.cartList
        })
      }
    }
  })
})

//购物车删除
router.post('/cartDel', function (req, res, next) {
  let userId = req.cookies.userId,
    productId = req.body.productId
  User.update({
    userId: userId
  }, {
    $pull: {
      'cartList': {
        'productId': productId
      }
    }
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        resutlt: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '删除成功',
        result: 'suc'
      })
    }
  })
})
//购物车商品数量/选中修改
router.post('/cartEdit', function (req, res, next) {
  let userId = req.cookies.userId,
    productNum = req.body.productNum,
    productId = req.body.productId,
    checked = req.body.checked
  //子文档的更新
  User.update({
    'userId': userId,
    "cartList.productId": productId
  }, {
    'cartList.$.productNum': productNum,
    'cartList.$.checked': checked
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        resutlt: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '更新成功',
        result: 'suc'
      })
    }
  })
})

//商品全选
router.post("/editCheckAll", function (req, res, next) {
  var userId = req.cookies.userId,
    checkAllFlag = req.body.checkAllFlag ? 1 : 0
  User.findOne({
    'userId': userId
  }, function (err, user) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        resutlt: ''
      })
    } else {
      if (user) {
        user.cartList.forEach(item => {
          item.checked = checkAllFlag
        })
        user.save(function (err, doc) {
          if (err) {
            res.json({
              status: '1',
              msg: err.message,
              resutlt: ''
            })
          } else {
            res.json({
              status: '0',
              msg: '',
              resutlt: 'suc'
            })
          }
        })
      }
    }
  })
})

//查询用户地址列表接口
router.get('/addressList', function (req, res, next) {
  var userId = req.cookies.userId
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '',
        result: doc.addressList
      })
    }
  })
})

//设置默认地址
router.post('/setDefault', function (req, res, next) {
  var userId = req.cookies.userId,
    addressId = req.body.addressId
  if (addressId) {
    User.findOne({
      userId: userId
    }, function (err, doc) {
      if (err) {
        res.json({
          status: '1',
          msg: err.message,
          result: ''
        })
      } else {
        var addressList = doc.addressList
        addressList.forEach((item) => {
          if (item.addressId == addressId) {
            item.isDefault = true
          } else {
            item.isDefault = false
          }
        })
      }
      doc.save(function (err1, doc1) {
        if (err) {
          res.json({
            status: '1',
            msg: err.message,
            result: ''
          })
        } else {
          res.json({
            status: '0',
            msg: '',
            result: addressList
          })
        }
      })
    })
  } else {
    res.json({
      status: '1003',
      msg: 'addresdId is not fined',
      result: ''
    })
  }
})

//删除地址
router.post("/addressDel", function (req, res, next) {
  var userId = req.cookies.userId,
    addressId = req.body.addressId
  User.update({
    userId: userId
  }, {
    $pull: {
      'addressList': {
        'addressId': addressId
      }
    }
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        resutlt: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '删除成功',
        result: 'suc'
      })
    }
  })
})

//创建订单

router.post('/payMent', function (req, res, next) {
  var userId = req.cookies.userId,
    orderTotal = req.body.orderTotal,
    addressId = req.body.addressId
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      req.json({
        status: '1',
        msg: er.message,
        result: ''
      })
    } else {
      //获取当前用户的地址信息
      var address = {}
      doc.addressList.forEach(item => {
        if (addressId = item.addressId) {
          address = item
        }
      })
      //获取用户购物车购买的商品
      var goodList = [],
        goodList = doc.cartList.filter(item => {
          return item.checked == '1'
        })
      //生成订单ID
      var platform = '123'
      var r1 = Math.floor(Math.random() * 10)
      var r2 = Math.floor(Math.random() * 10)
      var sysDate = new Date().Format('yyyyMMddhhmmss')
      var createDate = new Date().Format('yyyy-MM-dd hh:mm:ss')
      var orderId = platform + r1 + sysDate + r2
      //创建订单
      var order = {
        orderId: orderId,
        orderTotal: orderTotal,
        addressInfo: address,
        goodsList: goodList,
        orderStatus: 1,
        createDate: new Date()
      }
      //
      doc._doc.orderList.push(order)
      doc.save(function (err1, doc1) {
        if (err1) {
          req.json({
            status: '1',
            msg: er.message,
            result: ''
          })
        } else {
          res.json({
            status: '0',
            msg: '',
            result: {
              orderId: order.orderId,
              orderTotal: order.orderTotal
            }
          })
        }
      })
    }
  })
})
//根据订单ID查询订单信息
router.get('/orderDetail', function (req, res, next) {
  var userId = req.cookies.userId,
    orderId = req.param('orderId')
  User.findOne({
    userId: userId
  }, function (err, userInfo) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      var orderList = userInfo._doc.orderList
      if (orderList && orderList.length > 0) {
        var orderTotal = 0
        orderList.forEach(item => {
          if (item.orderId == orderId) {
            orderTotal = item.orderTotal
          }
        })
        if (orderTotal > 0) {
          res.json({
            status: '0',
            msg: '',
            result: {
              orderId: orderId,
              orderTotal: orderTotal
            }
          })
        } else {
          res.json({
            status: '210001',
            msg: '无此订单',
            result: ''
          })
        }
      } else {
        res.json({
          status: '210001',
          msg: '无此订单',
          result: ''
        })
      }
    }
  })

})

module.exports = router;
