@declaration_confirm
Feature: Declaration confirm and submit

  Background:
    Given I have signed in with teacher3
    Given all pupils have an attendance reason Absent

  Scenario: Confirm and submit page displays as per the design
    Given I am on the confirm and submit page
    Then I can see the confirm and submit page as per the design

  Scenario: All three tick boxes must be checked
    Given I am on the confirm and submit page
    When I submit the form without ticking all three boxes
    Then I can see a validation error for confirm boxes