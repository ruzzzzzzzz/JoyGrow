import { Mail, Phone, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';
import joyImage from 'figma:asset/ebd33da1c91354be18169c74abee5c02fe5f89cc.png';

export function ContactUs() {
  const adminEmail = 'joygrowapplication@gmail.com';
  
  const creatorEmails = [
    'roseannjoy.mendoza@cvsu.edu.ph',
    'merryjoy.villanueva@cvsu.edu.ph',
    'jannahjoy.condes@cvsu.edu.ph',
  ];
  
  const phoneNumbers = [
    '09510676159',
    '09543506818',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 pb-20 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-lg">
              <img src={joyImage} alt="Joy" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Contact Us
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Have questions or need support? We're here to help! Reach out to us through any of the channels below.
          </p>
        </motion.div>

        {/* Admin Application Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-md">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-pink-900">Admin Application Email</CardTitle>
                  <CardDescription className="text-pink-700">Primary contact for app-related inquiries</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <a 
                href={`mailto:${adminEmail}`}
                className="inline-block px-4 py-3 bg-white rounded-lg hover:bg-pink-50 transition-colors border border-pink-200 text-pink-700 hover:text-pink-900 w-full sm:w-auto text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="break-all text-sm sm:text-base">{adminEmail}</span>
                </div>
              </a>
            </CardContent>
          </Card>
        </motion.div>

        {/* Creators' Emails */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Creators' Emails</CardTitle>
                  <CardDescription>Connect with our development team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creatorEmails.map((email, index) => (
                  <a
                    key={index}
                    href={`mailto:${email}`}
                    className="px-4 py-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200 text-purple-700 hover:text-purple-900 text-center group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="break-all text-xs sm:text-sm">{email}</span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="text-lg text-gray-900">We'd Love to Hear from You!</h3>
                <p className="text-gray-600 text-sm max-w-xl mx-auto">
                  Whether you have a question, feedback, or need technical support, our team is ready to assist you. 
                  Feel free to reach out via email, and we'll get back to you as soon as possible.
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="px-3 py-1 bg-white/60 rounded-full">📧 Email Support</span>
                  <span className="px-3 py-1 bg-white/60 rounded-full">🌐 Available Offline</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 pt-4"
        >
          <p>✨ This contact information is accessible both online and offline ✨</p>
        </motion.div>
      </div>
    </div>
  );
}