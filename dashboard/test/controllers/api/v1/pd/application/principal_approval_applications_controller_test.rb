require 'test_helper'

module Api::V1::Pd::Application
  class PrincipalApprovalApplicationsControllerTest < ::ActionController::TestCase
    test 'Updates user and application_guid upon submit' do
      teacher_application = create :pd_teacher1819_application, application_guid: 'guid'

      principal = create :teacher
      sign_in(principal)

      assert_creates(Pd::Application::PrincipalApproval1819Application) do
        put :create, params: {
          form_data: build(:pd_principal_approval1819_application_hash),
          application_guid: 'guid'
        }
      end

      application = Pd::Application::PrincipalApproval1819Application.find_by(application_guid: 'guid')
      assert_equal principal, application.user

      teacher_application.reload
      expected_principal_fields = {
        principal_approval: 'Yes',
        schedule_confirmed: 'Yes',
        diversity_recruitment: 'Yes',
        free_lunch_percent: '50%',
        underrepresented_minority_percent: '52.0',
        wont_replace_existing_course: Pd::Application::PrincipalApproval1819Application.options[:replace_course][1]
      }
      actual_principal_fields = teacher_application.sanitize_form_data_hash.select do |k, _|
        expected_principal_fields.keys.include? k
      end

      assert_equal expected_principal_fields, actual_principal_fields
    end
  end
end
