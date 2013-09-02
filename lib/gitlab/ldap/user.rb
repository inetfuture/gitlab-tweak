# LDAP extension for User model
#
# * Find or create user from omniauth.auth data
# * Links LDAP account with existing user
#
module Gitlab
  module LDAP
    class User
      class << self
        def find(uid, email)
          # Look for user with ldap provider and same uid
          user = model.ldap.where(extern_uid: uid).last
          return user if user

          # Look for user with same emails
          #
          # Possible cases:
          # * When user already has account and need to link his LDAP account.
          # * LDAP uid changed for user with same email and we need to update his uid
          #
          user = model.find_by_email(email)

          if user
            user.update_attributes(extern_uid: uid, provider: 'ldap')
            log.info("(LDAP) Updating legacy LDAP user #{email} with extern_uid => #{uid}")
          end

          user
        end

        def create(uid, email, name)
          password = Devise.friendly_token[0, 8].downcase
          username = email.match(/^[^@]*/)[0]

          opts = {
            extern_uid: uid,
            provider: 'ldap',
            name: name,
            username: username,
            email: email,
            password: password,
            password_confirmation: password,
          }

          user = model.new(opts, as: :admin).with_defaults
          user.save!
          log.info "(LDAP) Creating user #{email} from login with extern_uid => #{uid}"

          user
        end

        def find_or_create(auth)
          uid, email, name = uid(auth), email(auth), name(auth)

          if uid.blank? || email.blank?
            raise_error("Account must provide an uid and email address")
          end

          user = find(uid, email)
          user = create(uid, email, name) unless user
          user
        end

        private

        def uid(auth)
          auth.info.uid
        end

        def email(auth)
          auth.info.email.downcase unless auth.info.email.nil?
        end

        def name(auth)
          auth.info.name.to_s.force_encoding("utf-8")
        end

        def log
          Gitlab::AppLogger
        end

        def raise_error(message)
          raise OmniAuth::Error, "(LDAP) " + message
        end

        def model
          ::User
        end
      end
    end
  end
end
