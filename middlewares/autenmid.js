const express = require('express');
const jwr = require('jsonwebtoken');


const protect = (req, res, next) => { let token = req.headers.authorization;
     if (!token) { return res.status(401).json({ message: 'Token não fornecido' });
     } token = token.split(' ')[1]; jwr.verify(token, process.env.JWT_SECRET,
         (err, decoded) => { if (err) { return res.status(401).json({ message: 'Token inválido' });
         } req.user = decoded; next(); });
        
         };
module.exports = { protect };