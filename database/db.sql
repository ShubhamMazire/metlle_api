create database companybranchmanagement;
use companybranchmanagement;

create table `Compnay`
(
`id`            INT(11) NOT NULL PRIMARY KEY auto_increment ,
`name`          VARCHAR(255) NOT NULL ,
`Industry` ENUM ('Advertising','Agriculture Industry','Communications Industry','Construction Industry','Creative Industries','Education','Entertainment Industry','Farming','Fashion','Finance','Green Industry','Heavy Industry','Hospitality Industry','Information Industry','Information Technology','Infrastructure','Light Industry','Manufacturing','Materials','Media','Music Industry','Primary Industry','Publishing','Retail','Robotics','Secondary Industry','Service Industry','Space','Space Industry','Technology Industry','Telecom'),
`Website` VARCHAR(700) NOT NULL,
`ContactEmail` VARCHAR(700) NOT NULL,
`created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ,
`updated_at`    DATETIME on UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


create table `branches`
(
`id`            INT(11) NOT NULL PRIMARY KEY auto_increment ,
`CompanyId` INT(11) NOT NULL,
`BranchName` VARCHAR(700) NOT NULL,
`AddressLine1` VARCHAR(700) NOT NULL,
`AddressLine2` VARCHAR(700) NOT NULL,
`City` VARCHAR(700) NOT NULL,
`State` VARCHAR(700) NOT NULL,
`PinCode` int(6),
`Phone` VARCHAR(20) NOT NULL,
`created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ,
`updated_at`    DATETIME on UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`CompanyId`) REFERENCES compnay(id) ON UPDATE CASCADE  ON DELETE CASCADE
);
