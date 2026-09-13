Feature: Additional meaningful scenarios
  As a quality-conscious team
  We want to validate behaviour beyond the required happy paths
  So that realistic edge cases cannot silently regress

  # Why these extra scenarios?
  #
  # The five required scenarios cover the core arithmetic, validation of
  # "eat more than stock" and reset. The scenarios below exercise behaviour
  # a real user hits all the time and that the required list does not pin
  # down explicitly:
  #
  #  1. Empty form      - default state must be zero, not an error.
  #  2. Non-numeric     - typing "abc" is rejected with a clear message.
  #  3. Negative        - typing "-2" is rejected; negative quantities are
  #                       meaningless for a counter.
  #  4. Eat everything  - the boundary case of eating your entire stock must
  #                       land on exactly zero (not an error, not -1).
  #  5. Recalculate     - a second calculation must replace the previous
  #                       result, not accumulate on top of it.
  #  6. Recover         - fixing bad input must clear the error and produce
  #                       the correct result.

  Scenario: An empty form produces zeros, not an error
    Given I am on the Vegetable Counter page
    When I calculate the remaining vegetables
    Then the application should show 0 cucumbers remaining
    And the total remaining should be 0
    And I should not see an error message

  Scenario: Non-numeric stock is rejected
    Given I am on the Vegetable Counter page
    And I enter "abc" as the number of cucumbers in stock
    When I calculate the remaining vegetables
    Then I should see an error about the quantity for cucumbers
    And the total should show a dash instead of a number

  Scenario: Negative eaten quantity is rejected
    Given I am on the Vegetable Counter page
    And I have 5 carrots in stock
    And I enter "-2" as the number of carrots eaten
    When I calculate the remaining vegetables
    Then I should see an error about the quantity for carrots
    And the total should show a dash instead of a number

  Scenario: Eating your entire stock leaves zero
    Given I am on the Vegetable Counter page
    And I have 5 cucumbers in stock
    And I eat 5 cucumbers
    When I calculate the remaining vegetables
    Then the application should show 0 cucumbers remaining
    And the total remaining should be 0
    And I should not see an error message

  Scenario: Recalculating replaces, not accumulates, the previous result
    Given I am on the Vegetable Counter page
    And I have 5 cucumbers in stock
    And I eat 3 cucumbers
    When I calculate the remaining vegetables
    Then the application should show 2 cucumbers remaining
    When I change the eaten amount for cucumbers to 4
    And I calculate the remaining vegetables
    Then the application should show 1 cucumber remaining

  Scenario: A fixed error clears and shows the correct result
    Given I am on the Vegetable Counter page
    And I have 2 cucumbers in stock
    And I eat 5 cucumbers
    When I calculate the remaining vegetables
    Then I should see an error message
    And the total should show a dash instead of a number
    When I change the eaten amount for cucumbers to 1
    And I calculate the remaining vegetables
    Then I should not see an error message
    And the application should show 1 cucumber remaining
    And the total remaining should be 1
