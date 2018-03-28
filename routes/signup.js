var path=require('path')
var sha1=require('sha1')
var express=require('express');
var router=express.Router();

var userModel=require('../models/users')
var checkNotLogin=require('../middlewares/check').checkNotLogin;

//get/signup注册页
router.get('/',checkNotLogin,function(req,res,next){
	res.render('signup')
})

//post/signup用户注册
router.post('/',checkNotLogin,function(req,res,next){
	var name=req.fields.name;
	var gender=req.fields.gender;
	var bio=req.fields.bio;
	var avatar= req.files.avatar.path.split(path.sep).pop();
	var password=req.fields.password;
	var repassword=req.fields.repassword;
	//校验参数
	try{
		if(!(name.length>=1 && name.length<=10)){
			throw new Error('名字限制在1-10个字符内')
		}
		if(['m','f','x'].indexOf(gender)===-1){
			throw new Error('性别只能是m、f或者x')
		}
		if(!(bio.length>=1 && bio.length<=30)){
			throw new Error('个人简介请限制在1-30个字符之间')
		}
		if(!avatar){
			throw new Error('请上传头像')
		}
		if(password.length<6){
			throw new Error('请设置六位数以上的密码')
		}
		if(password!==repassword){
			throw new Error('两次输入的密码不一致')
		}

	} catch(e){
		req.flash('error',e.message)
		console.log(e.message)
		return res.redirect('/signup')
	}

	//明文密码加密
	password=sha1(password)

	//特写入数据库的用户信息
	var user={
		name:name,
		password:password,
		gender:gender,
		bio:bio,
		avatar:avatar
	};
	//用户信息写入数据库
	userModel.create(user).then(function(result){
		//此user是插入mongodb后的值，包含_id
		user=result.ops[0];
		//将用户信息存入session
		delete user.password;
		req.session.user=user
		//写入flash
		req.flash('success','注册成功')
		//跳转到首页
		res.redirect('/posts')
	})
	.catch(function(e){
		//用户名被占用则跳回注册页，而不是错误页
		if(e.message.match('E11000 duplcate key')){
			req.flash('error','用户名已被占用');
			return res.redirect('/signup')
		}
		next(e)
	})
})

module.exports=router